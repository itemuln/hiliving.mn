package com.hiliving.identity.account.application;

import com.hiliving.api.error.ApiRequestException;
import com.hiliving.identity.account.api.AddressRequest;
import com.hiliving.identity.account.api.AddressResponse;
import com.hiliving.identity.user.application.IdentityNormalizer;
import com.hiliving.identity.user.persistence.UserAddressEntity;
import com.hiliving.identity.user.persistence.UserAddressRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {
    private final UserAddressRepository addresses;
    private final UserRepository users;
    private final IdentityNormalizer normalizer;

    public AddressService(UserAddressRepository addresses, UserRepository users, IdentityNormalizer normalizer) {
        this.addresses = addresses;
        this.users = users;
        this.normalizer = normalizer;
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> findAll(Long userId) {
        return addresses.findAllByUserIdOrderByDefaultAddressDescCreatedAtAscIdAsc(userId)
                .stream().map(AddressResponse::from).toList();
    }

    @Transactional
    public AddressResponse create(Long userId, AddressRequest request) {
        UserEntity user = users.findById(userId).orElseThrow(this::notFound);
        if (request.defaultAddress()) addresses.clearDefault(userId, null);
        UserAddressEntity address = UserAddressEntity.create(user);
        apply(address, request);
        return AddressResponse.from(addresses.save(address));
    }

    @Transactional
    public AddressResponse update(Long userId, Long addressId, AddressRequest request) {
        UserAddressEntity address = addresses.findByIdAndUserId(addressId, userId).orElseThrow(this::notFound);
        if (request.defaultAddress()) addresses.clearDefault(userId, addressId);
        apply(address, request);
        return AddressResponse.from(addresses.save(address));
    }

    @Transactional
    public void delete(Long userId, Long addressId) {
        UserAddressEntity address = addresses.findByIdAndUserId(addressId, userId).orElseThrow(this::notFound);
        addresses.delete(address);
    }

    private void apply(UserAddressEntity address, AddressRequest request) {
        address.update(
                request.label().trim(), request.cityOrProvince().trim(), request.districtOrSoum().trim(),
                trimNullable(request.khorooOrBag()), request.addressLine().trim(), trimNullable(request.additionalDetails()),
                request.recipientName().trim(), normalizer.phone(request.recipientPhone()), request.defaultAddress()
        );
    }

    private String trimNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ApiRequestException notFound() {
        return new ApiRequestException(HttpStatus.NOT_FOUND, "ADDRESS_NOT_FOUND", "Address was not found");
    }
}
